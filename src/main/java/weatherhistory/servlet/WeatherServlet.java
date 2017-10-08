package weatherhistory.servlet;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import weatherhistory.server.Config;

@WebServlet(name = "WeatherServlet", urlPatterns = {"/WeatherServlet"})
public class WeatherServlet extends HttpServlet
{
	private static final long serialVersionUID = 1L;
	private Config config;
	
	public WeatherServlet(Config config)
	{
		this.config = config;
	}
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{

		//super.doGet(req, resp);
		// Process the HTTP doGet request.
		//super.doGet(request, resp);
		response.setContentType("text/html; charset=windows-1252");
	    //response.setContentType("application/json");
	    //response.setCharacterEncoding("UTF-8");
		PrintWriter out = response.getWriter();
	    out.println("<html>");
	    out.println("<head><title>demolet</title></head>");
	    out.println("<body>");
	    out.println("<p>The servlet has received a GET. This is the reply.</p>");
	    out.println("</body></html>");
		out.close();
		
	}
	
	private void connectToDatabase()
	{
		//config.getDatabaseURL()
		//config.getName()
		//config.getPassword()
	}
	
}
